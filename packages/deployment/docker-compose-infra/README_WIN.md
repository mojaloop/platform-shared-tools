
This is a tutorial to help you set Mojaloop environment for Windows 10, 11.


1. Install [Wsl](https://aka.ms/wslstorepage)

2. After Open PowerShell as admin and install a linux distribution at your choice, we use ubuntu, but if you're comfortable you can choose other:

	- ```wsl --list --online``` ( list all distribution available);

	- ```wsl --install -d <Distribution Name>``` ( install the distribution);

	- ```wsl --setdefault <Distribution Name>``` ( install the distribution)

3. Restart computer.

4. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

5. Open Docker Desktop, go to settings, resources, WSL integration and then enable integration with Default WSL distro and choose the one you've installed.

6. Open Powershel as admin and type:

	-  ```wsl -d docker-desktop```

	-  ```sysctl -w vm.max_map_count=262144```

7. Install Zig (using Scoop).

- Install Scoop, if you haven't

- Open PowerShell and type :

	-  ```Set-ExecutionPolicy RemoteSigned -Scope CurrentUser```

	-  ```i**rm get.scoop.sh | iex```

- Install zig using scoop : ```scoop install zig```


8 - Environment is now set, you can start using MojaLoop infrastructure.


## PS
**If you have problems regarding VmmemWSL consuming too much memory, please click [here]( https://support.itsolver.net/hc/en-au/articles/5742283229967-How-to-fix-vmmem-high-memory-usage-with-Docker-WSL2)

An example for the .wslconfig can be:**

```
# Settings apply across all Linux distros running on WSL 2
[wsl2]

# Limits VM memory to use no more than 4 GB, this can be set as whole numbers using GB or MB
memory=6GB

# Sets the VM to use two virtual processors
processors=4

guiApplications=false
```

